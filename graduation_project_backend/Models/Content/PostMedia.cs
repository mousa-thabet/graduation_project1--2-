using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Content;

public sealed class PostMedia
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid MediaId { get; set; }
    public MediaType Type { get; set; }
    public string? Name { get; set; }
    public int SortOrder { get; set; }

    public Post Post { get; set; } = null!;
}
