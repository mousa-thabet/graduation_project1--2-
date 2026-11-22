using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Content;

public sealed class PostSave
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public Post Post { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
