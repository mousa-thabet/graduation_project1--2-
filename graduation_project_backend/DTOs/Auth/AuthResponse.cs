namespace graduation_project_backend.DTOs.Auth;

public sealed class AuthResponse
{
    public string Token { get; init; } = string.Empty;
    public long ExpiresAt { get; init; }
    public UserResponse User { get; init; } = new();
}
