import { Link } from 'react-router-dom';
import { keyFeatures, stats, testimonials } from '../../data/features';
import dashboardImg from '../../assets/landing/dashboard.png';

const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="heading-1 mb-6">
                Streamline Your{' '}
                <span className="text-primary-600">Office Operations</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                An all-in-one platform for project management, HR, attendance, and
                daily reports, helping teams stay aligned, productive, and focused on
                work that truly matters every single day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/login" className="btn-primary text-base no-underline">
                  Start Free Trial
                </Link>
                <Link to="/how-it-works" className="btn-secondary text-base no-underline">
                  See How It Works
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                No credit card required. 14-day free trial.
              </p>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-2 md:p-4 overflow-hidden">
                <img
                  src={dashboardImg}
                  alt="OfficeFlow Dashboard Preview"
                  className="rounded-lg w-full h-auto"
                />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hidden md:block">
                99.9% Uptime
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white px-4 py-3 rounded-lg shadow-lg hidden md:block">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-primary-200 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-primary-300 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-primary-400 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-600">10k+ users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-2 mb-4">Everything You Need to Manage Your Office</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From HR tasks to project management, one platform handles everything
              so you can focus on priorities, productivity, and meaningful results every day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {keyFeatures.map((feature) => (
              <div
                key={feature.id}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg hover:border-primary-100 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <FeatureIcon name={feature.icon} className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="heading-3 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/features" className="btn-secondary inline-flex items-center">
              View All Features
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-600 py-12 md:py-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-100 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-2 mb-4">Trusted by Teams Everywhere</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how customers share their experiences using Arkera to
              simplify workflows, improve collaboration, and bring clarity to
              everyday workplace operations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-semibold">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workplace?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join teams already using Arkera to simplify workflows and improve efficiency.
            Start your free trial today and experience smoother project management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors no-underline">
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors no-underline"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper component for feature icons
const FeatureIcon = ({ name, className }: { name: string; className: string }) => {
  const icons: Record<string, React.ReactNode> = {
    users: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1" />
      </svg>
    ),
    kanban: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    clock: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    file: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };

  return icons[name] || icons.users;
};

export default HomePage;
