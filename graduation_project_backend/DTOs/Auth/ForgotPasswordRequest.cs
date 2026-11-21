using System.ComponentModel.DataAnnotations;

namespace graduation_project_backend.DTOs.Auth;

public sealed class ForgotPasswordRequest
{
    [Required]
    public string Account { get; init; } = string.Empty;
}
