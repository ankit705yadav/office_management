import { detailedFeatures, upcomingFeatures } from "../../data/features";

const FeaturesPage = () => {
  return (
    <div>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 py-16 md:py-24">
        <div className="container-custom text-center">
          <h1 className="heading-1 mb-6">
            Powerful Features for{" "}
            <span className="text-primary-600">Modern Teams</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Manage HR, projects, and daily operations in one powerful platform
            built for clarity, speed, and efficient teamwork across modern teams.
          </p>
        </div>
      </section>

      {/* Features List */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          {detailedFeatures.map((category, categoryIndex) => (
            <div
              key={category.id}
              className={`${categoryIndex !== 0 ? "mt-20 md:mt-28" : ""}`}
            >
              {/* Category Header */}
              <div className="text-center mb-12 md:mb-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
                  <CategoryIcon
                    name={category.icon}
                    className="w-8 h-8 text-primary-600"
                  />
                </div>
                <h2 className="heading-2 mb-4">{category.title}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {category.description}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {category.features.map((feature) => (
                  <div
                    key={feature.id}
                    className="bg-gray-50 rounded-xl p-6 md:p-8 hover:bg-primary-50 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                      <FeatureIcon
                        name={feature.icon}
                        className="w-6 h-6 text-primary-600"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-center text-sm text-gray-500"
                        >
                          <svg
                            className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Features - Combined Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full mb-4">
              Coming Soon
            </span>
            <h2 className="heading-2 mb-4">Upcoming Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're constantly improving. Here's what's coming next to make your
              workflow even better.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Finance & Payroll */}
            {upcomingFeatures.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                    <CategoryIcon
                      name={category.icon}
                      className="w-6 h-6 text-orange-600"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {category.title}
                    </h3>
                    <span className="text-xs font-medium text-orange-600">
                      Coming Soon
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  {category.description.replace(" - Coming Soon", "")}
                </p>
                <div className="space-y-3">
                  {category.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200"
                    >
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <FeatureIcon
                          name={feature.icon}
                          className="w-4 h-4 text-gray-400"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {feature.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Chat Platform Integrations */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Chat Platform Integrations
                  </h3>
                  <span className="text-xs font-medium text-orange-600">
                    Coming Soon
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Manage attendance, apply for leaves, and submit daily reports
                directly from your favorite messaging apps.
              </p>
              <div className="space-y-3">
                {["WhatsApp", "Telegram", "Google Chat"].map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                      <PlatformIcon name={platform} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {platform}
                      </div>
                      <div className="text-xs text-gray-500">
                        Integration in development
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Experience All Features Today
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial and explore all the features that make
            Arkera the complete solution for modern teams.
          </p>
          <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
};

// Helper components for icons
const CategoryIcon = ({
  name,
  className,
}: {
  name: string;
  className: string;
}) => {
  const icons: Record<string, React.ReactNode> = {
    users: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1"
        />
      </svg>
    ),
    folder: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
    dollar: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    activity: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  };

  return icons[name] || icons.users;
};

const FeatureIcon = ({
  name,
  className,
}: {
  name: string;
  className: string;
}) => {
  const icons: Record<string, React.ReactNode> = {
    calendar: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    clock: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    "calendar-star": (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    columns: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
    "check-square": (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    briefcase: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    calculator: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
    "file-text": (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    receipt: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
        />
      </svg>
    ),
    bell: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    layout: (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
  };

  return icons[name] || icons.calendar;
};

const PlatformIcon = ({ name }: { name: string }) => {
  switch (name) {
    case "WhatsApp":
      return (
        <svg
          className="w-6 h-6 text-green-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "Telegram":
      return (
        <svg
          className="w-6 h-6 text-blue-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case "Google Chat":
      return (
        <svg
          className="w-6 h-6 text-green-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z" />
        </svg>
      );
    default:
      return null;
  }
};

export default FeaturesPage;
