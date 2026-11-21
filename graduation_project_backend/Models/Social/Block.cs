namespace graduation_project_backend.Models.Social;

public sealed class Block
{
    public Guid Id { get; set; }
    public Guid BlockerId { get; set; }
    public Guid BlockedUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? RemovedAtUtc { get; set; }

    public User.ApplicationUser Blocker { get; set; } = null!;
    public User.ApplicationUser BlockedUser { get; set; } = null!;
}