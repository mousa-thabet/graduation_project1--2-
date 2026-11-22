using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Exam;

public sealed class ExamAttempt
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Guid ExamVersionId { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public int? Score { get; set; }
    public int TotalQuestions { get; set; }

    public Exam Exam { get; set; } = null!;
    public ExamVersion ExamVersion { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
    public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
}
