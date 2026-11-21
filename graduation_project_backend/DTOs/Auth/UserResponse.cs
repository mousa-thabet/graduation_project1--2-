namespace graduation_project_backend.DTOs.Auth;

public sealed class UserResponse
{
    public string Id { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public IReadOnlyCollection<string> Roles { get; init; } = [];
}
