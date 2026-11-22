using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Content;

public sealed class CommentLike
{
    public Guid Id { get; set; }
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public Comment Comment { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
