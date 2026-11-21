using graduation_project_backend.DTOs.Auth;
using graduation_project_backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace graduation_project_backend.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors });
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid account or password." });
        }

        return Ok(result.Value);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> GetCurrentUser(
        CancellationToken cancellationToken)
    {
        var result = await _authService.GetCurrentUserAsync(User, cancellationToken);
        return result.Succeeded
            ? Ok(result.Value)
            : Unauthorized(new { message = "The authenticated user could not be resolved." });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RequestPasswordResetAsync(request, cancellationToken);
        return result switch
        {
            PasswordResetRequestStatus.Accepted => Ok(new
            {
                message = "If the account exists, a verification code has been sent."
            }),
            PasswordResetRequestStatus.EmailDeliveryNotConfigured => StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "Password reset email delivery is not configured." }),
            _ => StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { message = "Password reset delivery is temporarily unavailable." })
        };
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.ResetPasswordAsync(request, cancellationToken);
        return result == PasswordResetStatus.Succeeded
            ? Ok(new { message = "Password reset completed successfully." })
            : BadRequest(new { message = "The reset request is invalid or has expired." });
    }
}
