import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Home } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClover} from "@fortawesome/free-solid-svg-icons";
const items = [
  {
    title: "Inicio",
    icon: Home,
    url: "#",
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu className="bg-header p-4">
          <span className="mx-auto text-4xl">
            Sandy Core <FontAwesomeIcon icon={faClover} className="shadow-light-200 shadow-lg"/>
          </span>
        </SidebarMenu>
        <SidebarGroupContent>
          {items.map((item) => (
            <SidebarMenu key={item.title} className="p-3">
              <a
                href={item.url}
                className="flex flex-row space-x-2 items-center text-4xl"
              >
                <item.icon size={36} />
                <span>{item.title}</span>
              </a>
            </SidebarMenu>
          ))}
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
