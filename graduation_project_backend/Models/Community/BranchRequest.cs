using graduation_project_backend.Models.User;

namespace graduation_project_backend.Models.Community;

public sealed class BranchRequest
{
    public Guid Id { get; set; }
    public Guid CommunityId { get; set; }
    public Guid ApplicantId { get; set; }
    public Guid RequestedBranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TagsJson { get; set; } = "[]";
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? RejectReason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public Guid? ReviewedById { get; set; }

    public Community Community { get; set; } = null!;
    public ApplicationUser Applicant { get; set; } = null!;
    public ApplicationUser? ReviewedBy { get; set; }
}