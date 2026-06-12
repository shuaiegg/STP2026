import { getConsultations } from './actions';
import { ConsultationList } from './ConsultationList';

export default async function ConsultationsPage() {
  const items = await getConsultations();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-brand-text-primary">咨询管理</h1>
        <p className="text-sm text-brand-text-muted mt-1">来自公开咨询表单的需求记录</p>
      </div>
      <ConsultationList items={items} />
    </div>
  );
}
