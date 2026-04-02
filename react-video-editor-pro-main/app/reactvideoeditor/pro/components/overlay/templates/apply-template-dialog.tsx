import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { TemplateOverlay } from "../../../types";

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate: TemplateOverlay | null;
  onApplyTemplate: (template: TemplateOverlay) => void;
}

export const ApplyTemplateDialog: React.FC<ApplyTemplateDialogProps> = ({
  open,
  onOpenChange,
  selectedTemplate,
  onApplyTemplate,
}) => {
  const handleApply = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[90%] max-w-md mx-auto rounded-lg p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-extralight text-foreground">
            应用模板
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground font-extralight">
            确定要将此模板添加到时间轴吗？会替换当前所有叠加层。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="h-8 text-xs font-extralight text-muted-foreground">
            取消
          </AlertDialogCancel>
          <AlertDialogAction className="h-8 text-xs font-extralight" onClick={handleApply}>
            应用模板
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 