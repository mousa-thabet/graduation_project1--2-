using ApplicationUserEntity = graduation_project_backend.Models.User.ApplicationUser;
using CommunityEntity = graduation_project_backend.Models.Community.Community;
using BranchEntity = graduation_project_backend.Models.Community.Branch;

namespace graduation_project_backend.Models.Exam;

public sealed class Exam
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public Guid CommunityId { get; set; }
    public Guid? BranchId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? DeletedAtUtc { get; set; }

    public ApplicationUserEntity Author { get; set; } = null!;
    public CommunityEntity Community { get; set; } = null!;
    public BranchEntity? Branch { get; set; }
    public ICollection<ExamVersion> Versions { get; set; } = new List<ExamVersion>();
    public ICollection<ExamAttempt> Attempts { get; set; } = new List<ExamAttempt>();
}
