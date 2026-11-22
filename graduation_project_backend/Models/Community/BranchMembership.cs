using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Community;

public sealed class BranchMembership
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid BranchId { get; set; }
    public DateTime JoinedAtUtc { get; set; }
    public DateTime? LeftAtUtc { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
}