using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Content;

public sealed class Comment
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? ReplyToHandle { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? DeletedAtUtc { get; set; }

    public Post Post { get; set; } = null!;
    public ApplicationUser Author { get; set; } = null!;
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public ICollection<CommentLike> Likes { get; set; } = new List<CommentLike>();
}
