using System.ComponentModel.DataAnnotations;

namespace graduation_project_backend.DTOs.Auth;

public sealed class RegisterRequest
{
    [Required]
    [MinLength(3)]
    [RegularExpression("^[A-Za-z0-9_.]+$")]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; init; } = string.Empty;

    [Required]
    public string ConfirmPassword { get; init; } = string.Empty;

    [Range(typeof(bool), "true", "true")]
    public bool Terms { get; init; }
}
