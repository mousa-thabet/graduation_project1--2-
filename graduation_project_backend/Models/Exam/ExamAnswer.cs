namespace graduation_project_backend.Models.Exam;

public sealed class ExamAnswer
{
    public Guid Id { get; set; }
    public Guid ExamAttemptId { get; set; }
    public Guid ExamVersionId { get; set; }
    public Guid ExamQuestionId { get; set; }
    public Guid? SelectedOptionId { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAtUtc { get; set; }

    public ExamAttempt ExamAttempt { get; set; } = null!;
    public ExamQuestion ExamQuestion { get; set; } = null!;
    public ExamQuestionOption? SelectedOption { get; set; }
}
