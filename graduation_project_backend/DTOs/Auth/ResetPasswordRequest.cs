using System.ComponentModel.DataAnnotations;

namespace graduation_project_backend.DTOs.Auth;

public sealed class ResetPasswordRequest
{
    [Required]
    public string Account { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^[0-9]{6}$")]
    public string Code { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; init; } = string.Empty;

    [Required]
    public string ConfirmPassword { get; init; } = string.Empty;
}
