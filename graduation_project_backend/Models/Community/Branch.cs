namespace graduation_project_backend.Models.Community;

public sealed class Branch
{
    public Guid Id { get; set; }
    public Guid CommunityId { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string TagsJson { get; set; } = "[]";
    public bool IsSystemDefined { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public Community Community { get; set; } = null!;
    public ICollection<BranchMembership> Memberships { get; set; } = new List<BranchMembership>();
}