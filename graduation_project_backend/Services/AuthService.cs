using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using graduation_project_backend.Data;
using graduation_project_backend.DTOs.Auth;
using graduation_project_backend.Models.Auth;
using graduation_project_backend.Models.User;
using graduation_project_backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace graduation_project_backend.Services;

public sealed class AuthService : IAuthService
{
    private const int ResetCodeLength = 6;
    private const int MaxResetAttempts = 5;
    private const int ResetCodeLifetimeMinutes = 15;
    private const int AccessTokenLifetimeMinutes = 15;

    private readonly ApplicationDbContext _dbContext;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<PasswordResetCode> _resetCodeHasher;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthService(
        ApplicationDbContext dbContext,
        IEmailSender emailSender,
        IConfiguration configuration,
        IPasswordHasher<PasswordResetCode> resetCodeHasher,
        RoleManager<IdentityRole<Guid>> roleManager,
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _emailSender = emailSender;
        _configuration = configuration;
        _resetCodeHasher = resetCodeHasher;
        _roleManager = roleManager;
        _signInManager = signInManager;
        _userManager = userManager;
    }

    public async Task<ServiceResult<AuthResponse>> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim();

        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return ServiceResult<AuthResponse>.Failure("Passwords do not match.");
        }

        if (!request.Terms)
        {
            return ServiceResult<AuthResponse>.Failure("Terms must be accepted.");
        }

        if (await _userManager.FindByNameAsync(username) is not null)
        {
            return ServiceResult<AuthResponse>.Failure("Registration could not be completed.");
        }

        if (await _userManager.FindByEmailAsync(email) is not null)
        {
            return ServiceResult<AuthResponse>.Failure("Registration could not be completed.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = username,
            Email = email,
            EmailConfirmed = false
        };

        if (!await _roleManager.RoleExistsAsync("Student"))
        {
            var roleResult = await _roleManager.CreateAsync(new IdentityRole<Guid>("Student"));
            if (!roleResult.Succeeded)
            {
                return ServiceResult<AuthResponse>.Failure("Registration could not be completed.");
            }
        }

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return ServiceResult<AuthResponse>.Failure(
                createResult.Errors.Select(error => error.Description).ToArray());
        }

        var roleAssignmentResult = await _userManager.AddToRoleAsync(user, "Student");
        if (!roleAssignmentResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return ServiceResult<AuthResponse>.Failure("Registration could not be completed.");
        }

        return ServiceResult<AuthResponse>.Success(await CreateAuthResponseAsync(user));
    }

    public async Task<ServiceResult<AuthResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var account = request.Account.Trim();
        var user = account.Contains('@', StringComparison.Ordinal)
            ? await _userManager.FindByEmailAsync(account)
            : await _userManager.FindByNameAsync(account);

        if (user is null)
        {
            return ServiceResult<AuthResponse>.Failure("Invalid account or password.");
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);

        if (!signInResult.Succeeded || await _userManager.IsLockedOutAsync(user))
        {
            return ServiceResult<AuthResponse>.Failure("Invalid account or password.");
        }

        return ServiceResult<AuthResponse>.Success(await CreateAuthResponseAsync(user));
    }

    public async Task<ServiceResult<UserResponse>> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        var userIdValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return ServiceResult<UserResponse>.Failure("The authenticated user could not be resolved.");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user is null
            ? ServiceResult<UserResponse>.Failure("The authenticated user could not be resolved.")
            : ServiceResult<UserResponse>.Success(await ToUserResponseAsync(user));
    }

    public async Task<PasswordResetRequestStatus> RequestPasswordResetAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_emailSender.IsConfigured)
        {
            return PasswordResetRequestStatus.EmailDeliveryNotConfigured;
        }

        var account = request.Account.Trim();
        var user = account.Contains('@', StringComparison.Ordinal)
            ? await _userManager.FindByEmailAsync(account)
            : await _userManager.FindByNameAsync(account);

        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            return PasswordResetRequestStatus.Accepted;
        }

        var activeCodes = await _dbContext.PasswordResetCodes
            .Where(code => code.UserId == user.Id && code.UsedAtUtc == null && code.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var activeCode in activeCodes)
        {
            activeCode.RevokedAtUtc = DateTime.UtcNow;
        }

        var plainCode = RandomNumberGenerator
            .GetInt32(0, 1_000_000)
            .ToString($"D{ResetCodeLength}", CultureInfo.InvariantCulture);

        var resetCode = new PasswordResetCode
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(ResetCodeLifetimeMinutes)
        };
        resetCode.CodeHash = _resetCodeHasher.HashPassword(resetCode, plainCode);

        _dbContext.PasswordResetCodes.Add(resetCode);
        await _dbContext.SaveChangesAsync(cancellationToken);

        bool sent;
        try
        {
            sent = await _emailSender.SendPasswordResetCodeAsync(
                user.Email,
                plainCode,
                cancellationToken);
        }
        catch
        {
            sent = false;
        }

        if (!sent)
        {
            resetCode.RevokedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return PasswordResetRequestStatus.DeliveryFailed;
        }

        return PasswordResetRequestStatus.Accepted;
    }

    public async Task<PasswordResetStatus> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return PasswordResetStatus.InvalidRequest;
        }

        var account = request.Account.Trim();
        var user = account.Contains('@', StringComparison.Ordinal)
            ? await _userManager.FindByEmailAsync(account)
            : await _userManager.FindByNameAsync(account);

        if (user is null)
        {
            return PasswordResetStatus.InvalidRequest;
        }

        var resetCode = await _dbContext.PasswordResetCodes
            .Where(code => code.UserId == user.Id && code.UsedAtUtc == null && code.RevokedAtUtc == null)
            .OrderByDescending(code => code.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (resetCode is null ||
            resetCode.ExpiresAtUtc <= DateTime.UtcNow ||
            resetCode.FailedAttempts >= MaxResetAttempts)
        {
            return PasswordResetStatus.InvalidRequest;
        }

        var verificationResult = _resetCodeHasher.VerifyHashedPassword(
            resetCode,
            resetCode.CodeHash,
            request.Code);

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            resetCode.FailedAttempts++;
            if (resetCode.FailedAttempts >= MaxResetAttempts)
            {
                resetCode.RevokedAtUtc = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return PasswordResetStatus.InvalidRequest;
        }

        var identityToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(
            user,
            identityToken,
            request.NewPassword);

        if (!resetResult.Succeeded)
        {
            return PasswordResetStatus.InvalidRequest;
        }

        resetCode.UsedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return PasswordResetStatus.Succeeded;
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(GetAccessTokenLifetimeMinutes());
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        }

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var signingKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT signing key is not configured.");
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt.ToUnixTimeMilliseconds(),
            User = await ToUserResponseAsync(user, roles)
        };
    }

    private async Task<UserResponse> ToUserResponseAsync(
        ApplicationUser user,
        IList<string>? roles = null)
    {
        roles ??= await _userManager.GetRolesAsync(user);

        return new UserResponse
        {
            Id = user.Id.ToString(),
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Roles = roles.ToArray()
        };
    }

    private int GetAccessTokenLifetimeMinutes()
    {
        var configured = _configuration.GetValue<int?>("Jwt:AccessTokenMinutes");
        return configured is > 0 ? configured.Value : AccessTokenLifetimeMinutes;
    }
}
