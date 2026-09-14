import re

with open("pages/Settings.tsx", "r") as f:
    content = f.read()

# We know the imports are at the top
imports_part = content.split("  const SectionHeader =")[0]

section_header = """const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-3 mt-8 px-4">
    {title}
  </h2>
);
"""

setting_item = """const SettingItem = ({
  icon: Icon,
  title,
  description,
  action,
  destructive = false,
}: any) => (
  <div className="flex items-center justify-between p-4 bg-surface-card border-b border-border-subtle last:border-0 hover:bg-surface-raised/50 transition-colors">
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${destructive ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-surface-raised border border-border-subtle text-text-secondary"}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <h3
          className={`font-bold text-[15px] ${destructive ? "text-red-500" : "text-text-primary"}`}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[11px] font-medium text-text-secondary mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="flex items-center">{action}</div>
  </div>
);
"""

# Extract the body of export const Settings: React.FC = () => {
settings_comp_start = content.find("export const Settings: React.FC = () => {")
body_start = content[settings_comp_start:]

# Find the point in the file where SectionHeader was originally (which is where the second part is)
handle_logout_part = body_start.split("  const handleLogout = async () => {")[1]
handle_logout_func = "  const handleLogout = async () => {" + handle_logout_part.split("  };\n")[0] + "  };\n"

return_stmt = content[content.find("  return ("):]
return_stmt = return_stmt.split("export default Settings;")[0]

new_content = imports_part + "\n" + section_header + "\n" + setting_item + "\nexport const Settings: React.FC = () => {\n"
new_content += body_start.split("  const handleLogout = async () => {")[0] + handle_logout_func + "\n" + return_stmt + "\nexport default Settings;\n"

with open("pages/Settings.tsx", "w") as f:
    f.write(new_content)
