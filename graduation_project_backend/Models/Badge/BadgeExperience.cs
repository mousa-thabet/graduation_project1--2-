using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Badge;

public sealed class BadgeExperience
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid BadgeGrantId { get; set; }
    public string Credential { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public BadgeExperienceProofType Proof { get; set; }
    public DateTime VerifiedAtUtc { get; set; }
    public Guid? VerifiedById { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public BadgeGrant BadgeGrant { get; set; } = null!;
    public ApplicationUser? VerifiedBy { get; set; }
}