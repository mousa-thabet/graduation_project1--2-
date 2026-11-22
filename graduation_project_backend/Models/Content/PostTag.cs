namespace graduation_project_backend.Models.Content;

public sealed class PostTag
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public string Value { get; set; } = string.Empty;

    public Post Post { get; set; } = null!;
}
