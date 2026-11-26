export default function PageHeader({ badge, icon: Icon, title, subtitle, actions }) {
  return (
    <div className="bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold uppercase tracking-wider">
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {badge}
            </div>
          )}
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
