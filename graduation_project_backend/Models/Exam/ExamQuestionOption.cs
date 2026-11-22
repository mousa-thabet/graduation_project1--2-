namespace graduation_project_backend.Models.Exam;

public sealed class ExamQuestionOption
{
    public Guid Id { get; set; }
    public Guid ExamQuestionId { get; set; }
    public int DisplayOrder { get; set; }
    public string Text { get; set; } = string.Empty;

    public ExamQuestion ExamQuestion { get; set; } = null!;
    public ICollection<ExamAnswer> SelectedAnswers { get; set; } = new List<ExamAnswer>();
}
