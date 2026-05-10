import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';


interface ToastProps {
  id: string | number
  title: string
  description?: string
  type: "success"|"error"|"default"|"warning"|"loading"
}


function toast(toast: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={toast.title}
      description={toast.description}
      type={toast.type}
    />
  ));
}

function Toast(props: ToastProps) {
  const { title, description, id, type } = props;

  const bg =
    type === 'success'
      ? 'bg-green-600/10 border-green-600/50'
      : type === 'error'
      ? 'bg-red-600/10 border-red-600/50'
      : type === 'warning'
      ? 'bg-yellow-500/10 border-yellow-500/50'
      : type === 'loading'
      ? 'bg-white/50'
      : 'bg-white/50';

  return (
    <div className={`flex flex-row items-center justify-center rounded-2xl backdrop-blur-[3px] border shadow w-50 md:w-fit px-4 py-2 gap-3 ${bg}`}>
        {/* Icon */}
        {type === "success" && <CircleCheckIcon className="size-4" />}
        {type === "error" && <OctagonXIcon className="size-4" />}
        {type === "warning" && <TriangleAlertIcon className="size-4" />}
        {type === "loading" && <Loader2Icon className="size-4 animate-spin" />}
        {type === "default" && <InfoIcon className="size-4" />}

        <div>
            <p className='font-semibold text-base'>{title}</p>
            <p className='text-sm'>{description}</p>
        </div>

        <XIcon onClick={() => sonnerToast.dismiss(id)} />
    </div>
  ); 
}

export default toast