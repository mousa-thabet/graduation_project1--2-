namespace graduation_project_backend.Models.Profile;

public sealed class UserStudyProfile
{
    public Guid UserId { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public DateTime JoinedAtUtc { get; set; }
    public Guid? CoverMediaId { get; set; }
    public Guid? PinnedPostId { get; set; }

    public User.ApplicationUser User { get; set; } = null!;
}