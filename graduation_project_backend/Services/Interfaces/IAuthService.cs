using System.Security.Claims;
using graduation_project_backend.DTOs.Auth;

namespace graduation_project_backend.Services.Interfaces;

public interface IAuthService
{
    Task<ServiceResult<AuthResponse>> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<AuthResponse>> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<UserResponse>> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default);

    Task<PasswordResetRequestStatus> RequestPasswordResetAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default);

    Task<PasswordResetStatus> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record ServiceResult<T>(
    bool Succeeded,
    T? Value,
    IReadOnlyCollection<string> Errors)
{
    public static ServiceResult<T> Success(T value) => new(true, value, []);

    public static ServiceResult<T> Failure(params string[] errors) => new(false, default, errors);
}

public enum PasswordResetRequestStatus
{
    Accepted,
    EmailDeliveryNotConfigured,
    DeliveryFailed
}

public enum PasswordResetStatus
{
    Succeeded,
    InvalidRequest
}
