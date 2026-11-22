namespace graduation_project_backend.Models.Community;

public sealed class Community
{
    public Guid Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool IsGeneral { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<CommunityMembership> Memberships { get; set; } = new List<CommunityMembership>();
    public ICollection<BranchRequest> BranchRequests { get; set; } = new List<BranchRequest>();
}