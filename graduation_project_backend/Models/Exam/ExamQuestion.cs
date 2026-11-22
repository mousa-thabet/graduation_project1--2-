namespace graduation_project_backend.Models.Exam;

public sealed class ExamQuestion
{
    public Guid Id { get; set; }
    public Guid ExamVersionId { get; set; }
    public int DisplayOrder { get; set; }
    public string Text { get; set; } = string.Empty;
    public Guid CorrectOptionId { get; set; }
    public Guid? ImageMediaId { get; set; }
    public string? TableJson { get; set; }
    public string? Code { get; set; }
    public string? Explanation { get; set; }

    public ExamVersion ExamVersion { get; set; } = null!;
    public ExamQuestionOption CorrectOption { get; set; } = null!;
    public ICollection<ExamQuestionOption> Options { get; set; } = new List<ExamQuestionOption>();
    public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
}
