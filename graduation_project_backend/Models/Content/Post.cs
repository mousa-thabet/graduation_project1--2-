using graduation_project_backend.Models.Community;
using graduation_project_backend.Models.User;
using CommunityEntity = graduation_project_backend.Models.Community.Community;

namespace graduation_project_backend.Models.Content;

public sealed class Post
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public PostSection Section { get; set; }
    public PostType Type { get; set; }
    public Guid? CommunityId { get; set; }
    public Guid? BranchId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public DateTime? ModeratedAtUtc { get; set; }
    public Guid? ModeratedById { get; set; }
    public string? ModerationReason { get; set; }

    public int? AchievementMinutes { get; set; }
    public string? AchievementTask { get; set; }
    public int? AchievementStreak { get; set; }

    public LiveStatus? LiveStatus { get; set; }
    public DateTime? LiveStartedAtUtc { get; set; }
    public DateTime? LiveEndedAtUtc { get; set; }
    public Guid? LiveThumbnailMediaId { get; set; }
    public bool? LiveIsRecorded { get; set; }

    public ApplicationUser Author { get; set; } = null!;
    public CommunityEntity? Community { get; set; }
    public Branch? Branch { get; set; }
    public ApplicationUser? ModeratedBy { get; set; }
    public ICollection<PostMedia> Media { get; set; } = new List<PostMedia>();
    public ICollection<PostTag> Tags { get; set; } = new List<PostTag>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
    public ICollection<PostSave> Saves { get; set; } = new List<PostSave>();
    public Poll? Poll { get; set; }
}
