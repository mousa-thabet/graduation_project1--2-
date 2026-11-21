using Microsoft.AspNetCore.Identity;

namespace graduation_project_backend.Services;

public static class IdentityRoleInitializer
{
    private static readonly string[] Roles = ["Student", "Admin"];

    public static async Task InitializeAsync(
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(error => error.Description));
                    throw new InvalidOperationException($"Unable to create Identity role '{role}': {errors}");
                }
            }
        }
    }
}
