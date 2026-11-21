namespace graduation_project_backend.Models.Social;

public sealed class Follow
{
    public Guid Id { get; set; }
    public Guid FollowerId { get; set; }
    public Guid FollowedUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UnfollowedAtUtc { get; set; }

    public User.ApplicationUser Follower { get; set; } = null!;
    public User.ApplicationUser FollowedUser { get; set; } = null!;
}