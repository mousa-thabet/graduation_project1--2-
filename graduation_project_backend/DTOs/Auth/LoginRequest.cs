using System.ComponentModel.DataAnnotations;

namespace graduation_project_backend.DTOs.Auth;

public sealed class LoginRequest
{
    [Required]
    public string Account { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;
}
