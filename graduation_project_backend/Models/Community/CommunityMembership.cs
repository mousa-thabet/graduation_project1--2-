using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Community;

public sealed class CommunityMembership
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CommunityId { get; set; }
    public DateTime JoinedAtUtc { get; set; }
    public DateTime? LeftAtUtc { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public Community Community { get; set; } = null!;
}