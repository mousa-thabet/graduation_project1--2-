using graduation_project_backend.Models.Community;
using graduation_project_backend.Models.User;
using CommunityEntity = graduation_project_backend.Models.Community.Community;

namespace graduation_project_backend.Models.Badge;

public sealed class BadgeGrant
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public BadgeType Type { get; set; }
    public Guid? CommunityId { get; set; }
    public Guid? BadgeRequestId { get; set; }
    public Guid? GrantedById { get; set; }
    public DateTime GrantedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? RevocationReason { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public CommunityEntity? Community { get; set; }
    public BadgeRequest? BadgeRequest { get; set; }
    public ApplicationUser? GrantedBy { get; set; }
    public BadgeExperience? Experience { get; set; }
}