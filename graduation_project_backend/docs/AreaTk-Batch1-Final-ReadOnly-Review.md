# AreaTk — المراجعة النهائية للدفعة الأولى

## نوع المراجعة

هذه مراجعة Read-only للدفعة الأولى. تم فحص الملفات الحالية دون تعديل أي ملف من ملفات الكود.

لم يتم:

- إنشاء Migration
- تنفيذ Database Update
- تعديل Frontend
- تعديل Authentication
- تغيير `ApplicationDbContext` أثناء المراجعة

## الملفات التي تمت مراجعتها

1. `Models/User/ApplicationUser.cs`
2. `Models/Profile/UserStudyProfile.cs`
3. `Models/Profile/UserCommunityProfile.cs`
4. `Models/Social/Follow.cs`
5. `Models/Social/Block.cs`
6. `Data/Configurations/ApplicationUserConfiguration.cs`
7. `Data/Configurations/UserStudyProfileConfiguration.cs`
8. `Data/Configurations/UserCommunityProfileConfiguration.cs`
9. `Data/Configurations/FollowConfiguration.cs`
10. `Data/Configurations/BlockConfiguration.cs`
11. `Data/ApplicationDbContext.cs`

---

# 1. المحتويات الفعلية للملفات

## 1.1 `Models/User/ApplicationUser.cs`

```csharp
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
```

## 1.2 `Models/Profile/UserStudyProfile.cs`

```csharp
namespace graduation_project_backend.Models.Profile;

public sealed class UserStudyProfile
{
	public Guid UserId { get; set; }
	public string Bio { get; set; } = string.Empty;
	public string University { get; set; } = string.Empty;
	public string Location { get; set; } = string.Empty;
	public string Website { get; set; } = string.Empty;
	public DateTime JoinedAtUtc { get; set; }
	public Guid? CoverMediaId { get; set; }
	public Guid? PinnedPostId { get; set; }

	public User.ApplicationUser User { get; set; } = null!;
}
```

## 1.3 `Models/Profile/UserCommunityProfile.cs`

```csharp
namespace graduation_project_backend.Models.Profile;

public sealed class UserCommunityProfile
{
	public Guid UserId { get; set; }
	public string Headline { get; set; } = string.Empty;
	public string Bio { get; set; } = string.Empty;
	public string University { get; set; } = string.Empty;
	public string Website { get; set; } = string.Empty;
	public DateTime JoinedAtUtc { get; set; }
	public Guid? CoverMediaId { get; set; }
	public Guid? PinnedPostId { get; set; }

	public User.ApplicationUser User { get; set; } = null!;
}
```

## 1.4 `Models/Social/Follow.cs`

```csharp
namespace graduation_project_backend.Models.Social;

public sealed class Follow
{
	public Guid Id { get; set; }
	public Guid FollowerId { get; set; }
	public Guid FollowedUserId { get; set; }
	public DateTime CreatedAtUtc { get; set; }
	public DateTime? UnfollowedAtUtc { get; set; }

	public User.ApplicationUser Follower { get; set; } = null!;
	public User.ApplicationUser FollowedUser { get; set; } = null!;
}
```

## 1.5 `Models/Social/Block.cs`

```csharp
namespace graduation_project_backend.Models.Social;

public sealed class Block
{
	public Guid Id { get; set; }
	public Guid BlockerId { get; set; }
	public Guid BlockedUserId { get; set; }
	public DateTime CreatedAtUtc { get; set; }
	public DateTime? RemovedAtUtc { get; set; }

	public User.ApplicationUser Blocker { get; set; } = null!;
	public User.ApplicationUser BlockedUser { get; set; } = null!;
}
```

## 1.6 `Data/Configurations/ApplicationUserConfiguration.cs`

```csharp
using graduation_project_backend.Models.User;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
	public void Configure(EntityTypeBuilder<ApplicationUser> builder)
	{
		builder.Property(user => user.DisplayName)
			.HasMaxLength(200)
			.IsRequired();

		builder.Property(user => user.CreatedAtUtc)
			.IsRequired();

		builder.HasOne(user => user.StudyProfile)
			.WithOne(profile => profile.User)
			.HasForeignKey<Models.Profile.UserStudyProfile>(profile => profile.UserId)
			.OnDelete(DeleteBehavior.Cascade);

		builder.HasOne(user => user.CommunityProfile)
			.WithOne(profile => profile.User)
			.HasForeignKey<Models.Profile.UserCommunityProfile>(profile => profile.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
```

## 1.7 `Data/Configurations/UserStudyProfileConfiguration.cs`

```csharp
using graduation_project_backend.Models.Profile;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class UserStudyProfileConfiguration : IEntityTypeConfiguration<UserStudyProfile>
{
	public void Configure(EntityTypeBuilder<UserStudyProfile> builder)
	{
		builder.HasKey(profile => profile.UserId);

		builder.Property(profile => profile.Bio)
			.HasMaxLength(2000)
			.IsRequired();

		builder.Property(profile => profile.University)
			.HasMaxLength(200)
			.IsRequired();

		builder.Property(profile => profile.Location)
			.HasMaxLength(200)
			.IsRequired();

		builder.Property(profile => profile.Website)
			.HasMaxLength(500)
			.IsRequired();

		builder.Property(profile => profile.JoinedAtUtc)
			.IsRequired();
	}
}
```

## 1.8 `Data/Configurations/UserCommunityProfileConfiguration.cs`

```csharp
using graduation_project_backend.Models.Profile;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class UserCommunityProfileConfiguration : IEntityTypeConfiguration<UserCommunityProfile>
{
	public void Configure(EntityTypeBuilder<UserCommunityProfile>
 builder)
	{
		builder.HasKey(profile => profile.UserId);

		builder.Property(profile => profile.Headline)
			.HasMaxLength(200)
			.IsRequired();

		builder.Property(profile => profile.Bio)
			.HasMaxLength(2000)
			.IsRequired();

		builder.Property(profile => profile.University)
			.HasMaxLength(200)
			.IsRequired();

		builder.Property(profile => profile.Website)
			.HasMaxLength(500)
			.IsRequired();

		builder.Property(profile => profile.JoinedAtUtc)
			.IsRequired();
	}
}
```

## 1.9 `Data/Configurations/FollowConfiguration.cs`

```csharp
using graduation_project_backend.Models.Social;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class FollowConfiguration : IEntityTypeConfiguration<Follow>
{
	public void Configure(EntityTypeBuilder<Follow> builder)
	{
		builder.HasKey(follow => follow.Id);

		builder.Property(follow => follow.CreatedAtUtc)
			.IsRequired();

		builder.HasIndex(follow => new { follow.FollowerId, follow.FollowedUserId })
			.IsUnique()
			.HasFilter("[UnfollowedAtUtc] IS NULL");

		builder.HasIndex(follow => follow.FollowerId);
		builder.HasIndex(follow => follow.FollowedUserId);

		builder.HasOne(follow => follow.Follower)
			.WithMany()
			.HasForeignKey(follow => follow.FollowerId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.HasOne(follow => follow.FollowedUser)
			.WithMany()
			.HasForeignKey(follow => follow.FollowedUserId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.ToTable(table => table.HasCheckConstraint(
			"CK_Follows_NoSelfFollow",
			"[FollowerId] <> [FollowedUserId]"));
	}
}
```

## 1.10 `Data/Configurations/BlockConfiguration.cs`

```csharp
using graduation_project_backend.Models.Social;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BlockConfiguration : IEntityTypeConfiguration<Block>
{
	public void Configure(EntityTypeBuilder<Block> builder)
	{
		builder.HasKey(block => block.Id);

		builder.Property(block => block.CreatedAtUtc)
			.IsRequired();

		builder.HasIndex(block => new { block.BlockerId, block.BlockedUserId })
			.IsUnique()
			.HasFilter("[RemovedAtUtc] IS NULL");

		builder.HasIndex(block => block.BlockerId);
		builder.HasIndex(block => block.BlockedUserId);

		builder.HasOne(block => block.Blocker)
			.WithMany()
			.HasForeignKey(block => block.BlockerId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.HasOne(block => block.BlockedUser)
			.WithMany()
			.HasForeignKey(block => block.BlockedUserId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.ToTable(table => table.HasCheckConstraint(
			"CK_Blocks_NoSelfBlock",
			"[BlockerId] <> [BlockedUserId]"));
	}
}
```

## 1.11 `Data/ApplicationDbContext.cs`

```csharp
using graduation_project_backend.Models.Auth;
using graduation_project_backend.Models.Profile;
using graduation_project_backend.Models.Social;
using graduation_project_backend.Models.User;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace graduation_project_backend.Data;

public sealed class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
	public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();
	public DbSet<UserStudyProfile> UserStudyProfiles => Set<UserStudyProfile>();
	public DbSet<UserCommunityProfile> UserCommunityProfiles => Set<UserCommunityProfile>();
	public DbSet<Follow> Follows => Set<Follow>();
	public DbSet<Block> Blocks => Set<Block>();

	public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
		: base(options)
	{
	}

	protected override void OnModelCreating(ModelBuilder builder)
	{
		base.OnModelCreating(builder);

		builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

		builder.Entity<PasswordResetCode>(entity =>
		{
			entity.HasKey(resetCode => resetCode.Id);
			entity.Property(resetCode => resetCode.CodeHash)
				.HasMaxLength(512)
				.IsRequired();

			entity.HasIndex(resetCode => new
			{
				resetCode.UserId,
				resetCode.ExpiresAtUtc,
				resetCode.UsedAtUtc,
				resetCode.RevokedAtUtc
			});

			entity.HasOne(resetCode => resetCode.User)
				.WithMany()
				.HasForeignKey(resetCode => resetCode.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});
	}
}
```

> ملاحظة: المحتوى أعلاه منقول من الملفات الحالية كما تمت قراءتها. يجب أن يكون سطر `UserCommunityProfileConfiguration` في الملف الفعلي بصيغة `EntityTypeBuilder<UserCommunityProfile> builder`; ظهور السطر مقسمًا في التقرير سببه تنسيق Markdown وليس تغييرًا مقصودًا في الكود.

---

# 2. نتائج المراجعة

## 2.1 علاقات One-to-One والـ PK/FK

نعم، العلاقات مضبوطة بالشكل المطلوب:

- `UserStudyProfile.UserId` هو Primary Key من خلال:

```csharp
builder.HasKey(profile => profile.UserId);
```

- `UserCommunityProfile.UserId` هو Primary Key بالطريقة نفسها.
- كلاهما Foreign Key إلى `ApplicationUser.Id` من خلال `ApplicationUserConfiguration`:

```csharp
.HasForeignKey<Models.Profile.UserStudyProfile>(profile => profile.UserId)
```

و:

```csharp
.HasForeignKey<Models.Profile.UserCommunityProfile>(profile => profile.UserId)
```

النتيجة هي One-to-One مع Shared Primary Key، وهي مناسبة لهذه الحالة.

## 2.2 إنهاء متابعة قديمة ثم إنشاء متابعة جديدة

نعم، التصميم يسمح بذلك:

- المتابعة القديمة تصبح `UnfollowedAtUtc IS NOT NULL`.
- الفهرس الفريد يطبق فقط على السجلات التي يكون فيها:

```sql
[UnfollowedAtUtc] IS NULL
```

- يمكن إنشاء سجل Follow جديد لنفس `FollowerId` و`FollowedUserId` بعد إنهاء القديمة.
- لا يمكن وجود أكثر من متابعة نشطة في الوقت نفسه.

## 2.3 إزالة حظر قديم ثم الحظر مجددًا

نعم، بنفس الآلية:

- الحظر القديم يصبح `RemovedAtUtc IS NOT NULL`.
- الفهرس الفريد يطبق فقط على الحظر النشط.
- يمكن إنشاء سجل Block جديد بعد إزالة الحظر السابق.

## 2.4 توافق الفهارس المصفاة مع SQL Server

نعم، صيغة الفهارس المفلترة متوافقة مع SQL Server:

```csharp
.HasFilter("[UnfollowedAtUtc] IS NULL");
```

و:

```csharp
.HasFilter("[RemovedAtUtc] IS NULL");
```

هذه الصيغة مناسبة لـ SQL Server، ولا ينبغي اعتبارها portable لجميع قواعد البيانات الأخرى.

## 2.5 الفهارس المكررة أو غير الضرورية

الفهرس المركب الفريد يبدأ بـ `FollowerId` ويتضمن `FollowedUserId`. لذلك فإن الفهرس المنفصل على `Follow.FollowerId` قد يكون غالبًا زائدًا لاستعلامات تبدأ بـ `FollowerId`، لأن الفهرس المركب يستطيع خدمة هذا الجزء.

وبالمثل، الفهرس المركب الفريد على `Block(BlockerId, BlockedUserId)` يجعل الفهرس المنفصل على `Block.BlockerId` غالبًا زائدًا.

أما الفهارس على:

- `Follow.FollowedUserId`
- `Block.BlockedUserId`

فهي مفيدة لاستعلامات «من يتابعني؟» و«من قام بحظري؟».

**النتيجة:** لا يوجد خطأ وظيفي، لكن يوجد احتمال فهرسين زائدين:

- `Follow.FollowerId`
- `Block.BlockerId`

يفضل مراجعة خطط الاستعلام قبل حذفهما. لم يتم تعديلهما في هذه المراجعة.

## 2.6 Check Constraints

القيود صحيحة ومتوافقة مع أسماء الخصائص التي تتحول إلى أسماء أعمدة افتراضية:

```sql
[FollowerId] <> [FollowedUserId]
```

```sql
[BlockerId] <> [BlockedUserId]
```

وتمنع متابعة أو حظر المستخدم لنفسه على مستوى قاعدة البيانات، وليس فقط على مستوى التطبيق.

## 2.7 Multiple Cascade Paths

لا يوجد Multiple Cascade Paths في العلاقات الحالية بسبب الآتي:

- الملفان الشخصيان يستخدمان Cascade من `ApplicationUser` إلى كل ملف.
- `Follow` يستخدم Restrict في علاقتيه إلى المستخدم.
- `Block` يستخدم Restrict في علاقتيه إلى المستخدم.
- `PasswordResetCode` يستخدم Cascade، لكنه لا يملك مسارًا Cascade موازيًا إلى نفس جدول تابع آخر ضمن هذه الدفعة.

لذلك لا يظهر مسار Cascade مزدوج من `ApplicationUser` إلى `Follow` أو `Block`.

## 2.8 الحذف المنطقي للمستخدم وسجلات Follow وBlock

الحذف المنطقي ممثل بالخصائص التالية:

```csharp
IsDeleted
DeletedAtUtc
IsActive
```

وبما أن حذف المستخدم منطقي وليس `DELETE` فعليًا:

- تبقى سجلات Follow وBlock في قاعدة البيانات.
- تبقى العلاقات التاريخية محفوظة.
- يجب أن تستبعد استعلامات التطبيق المستخدمين الذين لديهم `IsDeleted = true` أو `IsActive = false` عند عرض العلاقات النشطة.

المهم أن الحذف المنطقي ليس Global Query Filter حاليًا؛ لذلك يجب تطبيق شرط الحالة في الاستعلامات أو إضافته لاحقًا ضمن تصميم مركزي.

## 2.9 التوافق مع ASP.NET Core Identity

التوافق جيد:

- `ApplicationUser` ما زال يرث من `IdentityUser<Guid>`.
- لم تتغير خصائص Identity الموروثة.
- `ApplicationDbContext` ما زال يرث من:

```csharp
IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
```

- علاقات `Follow` و`Block` تشير إلى `ApplicationUser.Id` من النوع `Guid`.
- علاقات الملفات الشخصية تستخدم نفس مفتاح Identity.
- `PasswordResetCode` الحالي بقي كما هو.

## 2.10 استخدام Guid

الاستخدام متسق:

- `ApplicationUser` يستخدم `IdentityUser<Guid>`.
- `UserStudyProfile.UserId` من النوع `Guid`.
- `UserCommunityProfile.UserId` من النوع `Guid`.
- `Follow.Id`, `FollowerId`, `FollowedUserId` من النوع `Guid`.
- `Block.Id`, `BlockerId`, `BlockedUserId` من النوع `Guid`.
- `IdentityRole<Guid>` و`ApplicationDbContext` يستخدمان `Guid`.

لا توجد علاقة بين مفتاح `string` ومفتاح `Guid` في هذه الدفعة.

---

# 3. المشكلات المحتملة والملاحظات

## ملاحظة 1 — الفهرسان المنفصلان على طرفي الإنشاء

الفهرسان التاليان قد يكونان زائدين لأن الفهرس المركب يبدأ بالطرف نفسه:

```csharp
builder.HasIndex(follow => follow.FollowerId);
builder.HasIndex(block => block.BlockerId);
```

ليست مشكلة صحة أو توافق، بل ملاحظة أداء وحجم فهارس. يفضل اتخاذ القرار بعد مراجعة استعلامات الاستخدام.

## ملاحظة 2 — إعادة إنشاء العلاقة التاريخية

التصميم الحالي يحتفظ بتاريخ Follow وBlock وينشئ سجلًا جديدًا بعد الإنهاء أو الإزالة. هذا يحقق المتطلبات، لكن يجب أن تضمن Services مستقبلًا عدم إنشاء سجل جديد بينما يوجد سجل نشط، بسبب احتمالية التزامن بين طلبين متزامنين. الفهرس الفريد سيمنع التكرار على مستوى SQL Server، لكن الخدمة ينبغي أن تتعامل مع استثناء التعارض بشكل واضح.

## ملاحظة 3 — التواريخ UTC

أسماء الخصائص توضح أن التواريخ UTC، لكن EF Core/SQL Server لا يفرض تلقائيًا أن القيمة المرسلة فعلًا UTC. يجب أن تضمن Services أو طبقة وقت مركزية استخدام `DateTime.UtcNow`، وقد تضاف convention أو interceptor لاحقًا.

## ملاحظة 4 — خصائص Media وPinnedPost

الخصائص التالية موجودة كـ `Guid?` فقط دون Foreign Keys في هذه الدفعة:

- `AvatarMediaId`
- `CoverMediaId`
- `PinnedPostId`

هذا مناسب لأن كيانات `MediaFile` و`Post` لم تدخل ضمن نطاق الدفعة الأولى. يجب ربطها عند تنفيذ الدفعات الخاصة بها، مع تحديد DeleteBehavior المناسب.

## ملاحظة 5 — Cascade للملفات الشخصية

`Cascade` مناسب لأن الملفين تابعان مباشرة للمستخدم. ومع ذلك، التطبيق يعتمد عمليًا على الحذف المنطقي للمستخدم، لذلك لن يعمل Cascade إلا عند حذف فعلي للمستخدم، وهو أمر يجب تقييده في خدمات الإدارة.

## ملاحظة 6 — عدم وجود Navigation Collections

`ApplicationUser` لا يحتوي على Collections لـ `Follows` أو `Blocks`، لكن هذا لا يمنع عمل العلاقات؛ استخدام `.WithMany()` بدون navigation property صحيح. يمكن إضافة Collections لاحقًا فقط إذا احتاجها نموذج المجال أو الاستعلامات.

---

# 4. الحكم النهائي

## هل الدفعة الأولى جاهزة لإنشاء Migration مستقبلًا؟

نعم، من ناحية:

- صحة البناء الحالي.
- توافق أنواع المفاتيح `Guid`.
- علاقات One-to-One بالمفتاح المشترك.
- الفهارس المفلترة الخاصة بـ SQL Server.
- Check Constraints.
- DeleteBehavior وعدم وجود Multiple Cascade Paths في العلاقات الحالية.
- توافق `ApplicationUser` مع ASP.NET Core Identity.

الدفعة الأولى **جاهزة مبدئيًا لإنشاء Migration مستقبلًا** بعد التأكد من قرار المشروع النهائي بشأن:

1. الإبقاء على الفهرسين المنفصلين `FollowerId` و`BlockerId`.
2. آلية التعامل مع التزامن عند إعادة إنشاء Follow أو Block.
3. تطبيق استبعاد المستخدمين المحذوفين منطقيًا في الاستعلامات.
4. ربط `AvatarMediaId`, `CoverMediaId` و`PinnedPostId` بعد إنشاء كيانات Media وPost.

هذه الملاحظات لا تمنع إنشاء Migration للدفعة الحالية، لكنها يجب أن تؤخذ في الاعتبار قبل اعتماد مخطط قاعدة البيانات النهائي.

## نتيجة المراجعة

```text
Read-only review completed.
No source files changed.
No migration created.
No database update executed.
Batch 1 is structurally ready for a future migration.
```
