using graduation_project_backend.Models.Community;
using graduation_project_backend.Models.User;
using CommunityEntity = graduation_project_backend.Models.Community.Community;

namespace graduation_project_backend.Models.Badge;

public sealed class BadgeRequest
{
    public Guid Id { get; set; }
    public Guid ApplicantId { get; set; }
    public BadgeType Type { get; set; }
    public Guid? CommunityId { get; set; }
    public string About { get; set; } = string.Empty;
    public Guid? ProofMediaId { get; set; }
    public string? ProofName { get; set; }
    public BadgeRequestStatus Status { get; set; } = BadgeRequestStatus.Pending;
    public string? Reason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public Guid? ReviewedById { get; set; }
    public bool IsNotified { get; set; }

    public ApplicationUser Applicant { get; set; } = null!;
    public CommunityEntity? Community { get; set; }
    public ApplicationUser? ReviewedBy { get; set; }
    public BadgeGrant? Grant { get; set; }
}