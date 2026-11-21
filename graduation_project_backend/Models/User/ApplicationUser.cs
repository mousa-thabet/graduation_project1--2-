using Microsoft.AspNetCore.Identity;
using graduation_project_backend.Models.Profile;

namespace graduation_project_backend.Models.User;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public Guid? AvatarMediaId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }

    public UserStudyProfile? StudyProfile { get; set; }
    public UserCommunityProfile? CommunityProfile { get; set; }
}
