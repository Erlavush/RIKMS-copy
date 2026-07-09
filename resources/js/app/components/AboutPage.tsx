import { Link } from "react-router";
import {
  BookOpen,
  Share2,
  Globe,
  ShieldCheck,
  Building2,
  Users,
  UserCog,
  FileText,
  Target,
  Eye,
  Compass,
  FlaskConical,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { SDG_DATA, AGENCIES, STATISTICS } from "../data/mock-data";
import sdgImage from "figma:asset/192292a7be3e47fa8c3000002183f557b73258d1.png";

const OBJECTIVES = [
  {
    icon: BookOpen,
    title: "Research Accessibility",
    description:
      "Provide a centralized platform where stakeholders can easily access regional research studies.",
  },
  {
    icon: Share2,
    title: "Knowledge Sharing",
    description:
      "Promote collaboration and knowledge exchange among government agencies and research institutions.",
  },
  {
    icon: Globe,
    title: "Sustainable Development",
    description:
      "Support research initiatives aligned with the United Nations Sustainable Development Goals.",
  },
  {
    icon: ShieldCheck,
    title: "Data Integrity and Security",
    description:
      "Ensure that research information is securely managed and maintained with high data integrity.",
  },
];

const USER_ROLES = [
  {
    icon: Users,
    title: "Public Users",
    description: "Can browse and access published research studies.",
  },
  {
    icon: UserCog,
    title: "Agency Administrators",
    description:
      "Responsible for uploading and managing research studies from their respective institutions.",
  },
  {
    icon: ShieldCheck,
    title: "System Administrators",
    description: "Manage agencies, users, and system governance.",
  },
];

function getAgencyIcon(type: string) {
  switch (type) {
    case "Government Agency":
      return Building2;
    case "Research Consortium":
      return FlaskConical;
    case "Higher Education Institution":
      return GraduationCap;
    default:
      return Building2;
  }
}

export function AboutPage() {
  return (
    <div>
      {/* Page Header – Centered */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#2D4BA0] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
          <h1
            className="text-white mb-4 max-w-3xl mx-auto text-xl sm:text-2xl md:text-3xl"
            style={{ fontWeight: 700, lineHeight: 1.25 }}
          >
            About the Regionwide Integrated Knowledge Management System
          </h1>
          <p className="text-blue-100 leading-relaxed max-w-3xl mx-auto">
            The Regionwide Integrated Knowledge Management System (RIKMS) is a
            centralized digital platform designed to support the management,
            accessibility, and dissemination of research studies across the Davao
            Region.
          </p>
        </div>
      </section>

      {/* Section 2 – System Overview (Two-column) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="text-[#1E3A8A] mb-4 text-xl sm:text-2xl"
              style={{ fontWeight: 700 }}
            >
              What is RIKMS?
            </h2>
            <div className="space-y-4 text-[#374151] leading-relaxed">
              <p>
                The Regionwide Integrated Knowledge Management System (RIKMS)
                serves as a centralized repository of research studies conducted
                by government agencies, research consortia, and academic
                institutions within the Davao Region.
              </p>
              <p>
                The platform enhances research visibility, accessibility, and
                collaboration among stakeholders while supporting evidence-based
                decision-making and regional innovation.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-[#F9FAFB] rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
                <Lightbulb className="w-10 h-10 text-[#1E3A8A]" />
              </div>
              <p
                className="text-[#1E3A8A] text-center"
                style={{ fontSize: "1.1rem", fontWeight: 600 }}
              >
                Knowledge-Driven Regional Development
              </p>
              <p className="text-sm text-[#6B7280] text-center">
                Empowering innovation through accessible research and
                cross-institutional collaboration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 – Mission and Vision */}
      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vision Card */}
            <div className="bg-[#F9FAFB] rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <h3
                  className="text-[#1E3A8A]"
                  style={{ fontSize: "1.25rem", fontWeight: 700 }}
                >
                  Vision
                </h3>
              </div>
              <p className="text-[#374151] leading-relaxed">
                To become the leading regional knowledge platform that promotes
                research collaboration, innovation, and evidence-based
                development across the Davao Region.
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-[#F9FAFB] rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <h3
                  className="text-[#1E3A8A]"
                  style={{ fontSize: "1.25rem", fontWeight: 700 }}
                >
                  Mission
                </h3>
              </div>
              <p className="text-[#374151] leading-relaxed">
                To provide a secure and accessible platform that enables
                government agencies, research consortia, and academic
                institutions to manage, share, and disseminate research studies
                that support sustainable development and regional growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 – System Objectives */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h2
            className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl"
            style={{ fontWeight: 700 }}
          >
            System Objectives
          </h2>
          <p className="text-[#6B7280]">
            The core goals driving the development and operation of RIKMS
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {OBJECTIVES.map((obj) => (
            <div
              key={obj.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center mb-4">
                <obj.icon className="w-6 h-6 text-[#1E3A8A]" />
              </div>
              <h3
                className="text-[#1E3A8A] mb-2"
                style={{ fontSize: "1rem", fontWeight: 600 }}
              >
                {obj.title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {obj.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5 – Supporting the SDGs */}
      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2
              className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl"
              style={{ fontWeight: 700 }}
            >
              Supporting the Sustainable Development Goals
            </h2>
            
          </div>

          {/* Official SDG Image */}
          <div className="my-10 flex justify-center">
            <img
              src={sdgImage}
              alt="The 17 United Nations Sustainable Development Goals"
              className="w-full max-w-[800px] h-auto rounded-lg"
            />
          </div>

          {/* Caption */}
          <p className="text-sm text-[#6B7280] text-center max-w-2xl mx-auto mb-10 leading-relaxed">
            Research studies within RIKMS are categorized according to the 17
            Sustainable Development Goals to demonstrate their contribution to
            sustainable regional development.
          </p>

          {/* SDG Number Indicator Row */}
          

          {/* SDG Title List */}
          
        </div>
      </section>

      {/* Section 6 – Participating Institutions */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h2
            className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl"
            style={{ fontWeight: 700 }}
          >
            Participating Institutions
          </h2>
          <p className="text-[#6B7280]">
            Government agencies, research consortia, and academic institutions
            in the Davao Region
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENCIES.map((agency) => {
            const Icon = getAgencyIcon(agency.type);
            return (
              <Link
                key={agency.id}
                to={`/agencies/${agency.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-7 h-7 text-[#1E3A8A]" />
                </div>
                <p
                  className="text-[#1E3A8A] mb-0.5"
                  style={{ fontSize: "0.85rem", fontWeight: 600 }}
                >
                  {agency.abbreviation}
                </p>
                <p className="text-xs text-[#6B7280] line-clamp-2">
                  {agency.name}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Section 7 – System Users */}
      <section className="bg-white py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2
              className="text-[#1E3A8A] mb-2 text-xl sm:text-2xl"
              style={{ fontWeight: 700 }}
            >
              System Users
            </h2>
            <p className="text-[#6B7280]">Who can use the RIKMS platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {USER_ROLES.map((role) => (
              <div
                key={role.title}
                className="bg-[#F9FAFB] rounded-xl border border-gray-100 p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center mx-auto mb-4">
                  <role.icon className="w-8 h-8 text-[#1E3A8A]" />
                </div>
                <h3
                  className="text-[#1E3A8A] mb-2"
                  style={{ fontSize: "1.05rem", fontWeight: 600 }}
                >
                  {role.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 – Regional Impact */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#2D4BA0] text-white py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2
              className="text-white mb-3"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              Advancing Research in the Davao Region
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto leading-relaxed">
              RIKMS strengthens research collaboration and innovation across the
              Davao Region by providing a unified platform for knowledge
              management, enabling data-driven decision-making and
              evidence-based policy development for regional growth.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-blue-200" />
              </div>
              <p
                className="text-white"
                style={{ fontSize: "2rem", fontWeight: 700 }}
              >
                {STATISTICS.totalResearch.toLocaleString()}
              </p>
              <p className="text-sm text-blue-200">Total Research Studies</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="w-6 h-6 text-blue-200" />
              </div>
              <p
                className="text-white"
                style={{ fontSize: "2rem", fontWeight: 700 }}
              >
                {STATISTICS.participatingAgencies}
              </p>
              <p className="text-sm text-blue-200">Participating Agencies</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-blue-200" />
              </div>
              <p
                className="text-white"
                style={{ fontSize: "2rem", fontWeight: 700 }}
              >
                {STATISTICS.sdgsCovered}
              </p>
              <p className="text-sm text-blue-200">SDGs Covered</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}