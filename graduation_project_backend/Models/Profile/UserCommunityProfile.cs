namespace graduation_project_backend.Models.Profile;

public sealed class UserCommunityProfile
{
    public Guid UserId { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public DateTime JoinedAtUtc { get; set; }
    public Guid? CoverMediaId { get; set; }
    public Guid? PinnedPostId { get; set; }

    public User.ApplicationUser User { get; set; } = null!;
}