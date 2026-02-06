import { Link } from 'react-router-dom';
import { steps, roles } from '../../data/features';

const HowItWorksPage = () => {
  return (
    <div>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 py-16 md:py-24">
        <div className="container-custom text-center">
          <h1 className="heading-1 mb-6">
            Simple Setup,{' '}
            <span className="text-primary-600">Powerful Results</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Get your team started in minutes. Our intuitive platform makes
            managing office operations simple, clear, and effective.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-2 mb-4">Get Started in 4 Easy Steps</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From sign-up to full productivity in just a few simple, guided steps.
            </p>
          </div>

          {/* Desktop: Horizontal Timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute top-12 left-0 right-0 h-0.5 bg-primary-200"></div>

              <div className="grid grid-cols-4 gap-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="relative">
                    {/* Step Number */}
                    <div className="relative z-10 w-24 h-24 mx-auto bg-white border-4 border-primary-600 rounded-full flex items-center justify-center mb-6">
                      <span className="text-3xl font-bold text-primary-600">{step.number}</span>
                    </div>

                    {/* Arrow */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-12 -right-4 transform -translate-y-1/2 z-20">
                        <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <StepIcon name={step.icon} className="w-6 h-6 text-primary-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Vertical Timeline */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex gap-6">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-primary-200 mt-4"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                      <StepIcon name={step.icon} className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-2 mb-4">Built for Every Role</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every role, from administrators to employees, gets the right tools
              with appropriate access levels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {roles.map((role, index) => (
              <div
                key={role.title}
                className={`rounded-xl p-6 md:p-8 ${
                  index === 0
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  index === 0 ? 'bg-white/20' : 'bg-primary-100'
                }`}>
                  <RoleIcon
                    name={role.title.toLowerCase()}
                    className={`w-6 h-6 ${index === 0 ? 'text-white' : 'text-primary-600'}`}
                  />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${
                  index === 0 ? 'text-white' : 'text-gray-900'
                }`}>
                  {role.title}
                </h3>
                <p className={`text-sm mb-6 ${
                  index === 0 ? 'text-primary-100' : 'text-gray-600'
                }`}>
                  {role.description}
                </p>
                <ul className="space-y-3">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <svg
                        className={`w-4 h-4 mr-2 flex-shrink-0 ${
                          index === 0 ? 'text-primary-200' : 'text-primary-500'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={index === 0 ? 'text-primary-50' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-primary-100 text-primary-700 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Watch Demo
              </span>
              <h2 className="heading-2 mb-6">
                See Arkera in Action
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Take a quick walkthrough of the platform and see how easily you
                can manage daily operations, teams, and projects from a single,
                unified workspace.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Complete dashboard overview',
                  'Leave and attendance management',
                  'Project and task workflows',
                  'Payroll and expense processing',
                ].map((item) => (
                  <li key={item} className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-primary-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="btn-primary inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Full Demo
              </button>
            </div>
            <div className="relative">
              <div className="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-primary-700 transition-colors">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Click to play demo</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-100 rounded-full opacity-50 -z-10"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-50 rounded-full opacity-50 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using Arkera. Start your free trial
            and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors no-underline">
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors no-underline"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper components for icons
const StepIcon = ({ name, className }: { name: string; className: string }) => {
  const icons: Record<string, React.ReactNode> = {
    settings: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'user-plus': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    play: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'trending-up': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  };

  return icons[name] || icons.settings;
};

const RoleIcon = ({ name, className }: { name: string; className: string }) => {
  const icons: Record<string, React.ReactNode> = {
    admin: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    manager: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    employee: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return icons[name] || icons.employee;
};

export default HowItWorksPage;
