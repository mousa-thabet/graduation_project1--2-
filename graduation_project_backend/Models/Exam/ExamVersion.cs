namespace graduation_project_backend.Models.Exam;

public sealed class ExamVersion
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public int VersionNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public Exam Exam { get; set; } = null!;
    public ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
    public ICollection<ExamAttempt> Attempts { get; set; } = new List<ExamAttempt>();
}
