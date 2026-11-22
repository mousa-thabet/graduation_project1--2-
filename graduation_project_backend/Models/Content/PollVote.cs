using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Content;

public sealed class PollVote
{
    public Guid Id { get; set; }
    public Guid PollId { get; set; }
    public Guid PollOptionId { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public Poll Poll { get; set; } = null!;
    public PollOption PollOption { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
