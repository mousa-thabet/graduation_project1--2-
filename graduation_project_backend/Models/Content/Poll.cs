namespace graduation_project_backend.Models.Content;

public sealed class Poll
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }

    public Post Post { get; set; } = null!;
    public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
    public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
}
