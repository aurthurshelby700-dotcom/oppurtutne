"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { getMyServices, deleteService } from "@/lib/actions/services";
import { ServiceFormModal } from "@/components/dashboard/ServiceFormModal";
import { Loader2, Plus, MoreVertical, Edit, Trash, Eye, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollAware } from "@/hooks/useScrollAware";
import { AdPanel } from "@/components/dashboard/AdPanel";

export default function MyServicesPage() {
    const { activeMode, user } = useUser();
    const router = useRouter();
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);

    // Scroll Awareness
    const leftPanel = useScrollAware(3000);
    const rightPanel = useScrollAware(3000);

    // Redirect if not freelancer mode
    useEffect(() => {
        if (activeMode !== 'freelancer') {
            router.push('/');
        }
    }, [activeMode, router]);

    const loadServices = async () => {
        setIsLoading(true);
        try {
            const data = await getMyServices();
            if (data.success && data.services) {
                setServices(data.services);
            }
        } catch (error) {
            console.error("Failed to load services:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadServices();
    }, [user]);

    const handleEdit = (service: any) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (confirm("Are you sure you want to delete this service?")) {
            const res = await deleteService(id);
            if (res.success) {
                loadServices();
            } else {
                alert(res.error || "Failed to delete");
            }
        }
    };

    const handleCreate = () => {
        setSelectedService(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    const handleSuccess = () => {
        loadServices();
        setIsModalOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">
                {/* Left Content (8 cols) */}
                <div
                    className={cn(
                        "lg:col-span-8 h-full overflow-y-auto border-r border-border bg-background scrollbar-fade",
                        leftPanel.isScrolling && "scrolling"
                    )}
                    onScroll={leftPanel.onScroll}
                >
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">My Services</h1>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Create Service
                            </button>
                        </div>

                        {services.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                    Start earning by creating a service package. define your skills, price, and delivery time.
                                </p>
                                <button
                                    onClick={handleCreate}
                                    className="text-primary font-medium hover:underline"
                                >
                                    Create your first service &rarr;
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <div key={service._id} className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all group relative">
                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                service.status === 'active' ? "bg-green-100 text-green-700 border-green-200" :
                                                    service.status === 'draft' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                                        "bg-gray-100 text-gray-700 border-gray-200"
                                            )}>
                                                {service.status}
                                            </span>
                                        </div>

                                        <div className="p-5">
                                            <h3 className="font-semibold text-lg line-clamp-1 mb-2 pr-12">{service.title}</h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2 h-10 mb-4">
                                                {service.description}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm text-foreground font-medium mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-lg font-bold">${service.price}</span>
                                                    {service.pricingType === 'hourly' && <span className="text-muted-foreground text-xs font-normal">/hr</span>}
                                                </div>
                                                {service.deliveryTime && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {service.deliveryTime}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4 h-[26px] overflow-hidden">
                                                {service.skills?.slice(0, 3).map((skill: string) => (
                                                    <span key={skill} className="px-2 py-0.5 bg-secondary rounded text-[10px] font-medium text-secondary-foreground">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {service.skills?.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-secondary rounded text-[10px] font-medium text-secondary-foreground">
                                                        +{service.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-center justify-between">
                                            <button className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                                                <Eye className="h-3.5 w-3.5" /> Preview
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(service)}
                                                    className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(service._id, e)}
                                                    className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <ServiceFormModal
                            isOpen={isModalOpen}
                            onClose={handleModalClose}
                            onSuccess={handleSuccess}
                            serviceToEdit={selectedService}
                        />
                    </div>
                </div>

                {/* Right Content (Ads - 4 cols) */}
                <div
                    className={cn(
                        "lg:col-span-4 h-full overflow-y-auto p-6 border-l border-border/0 scrollbar-fade",
                        rightPanel.isScrolling && "scrolling"
                    )}
                    onScroll={rightPanel.onScroll}
                >
                    <AdPanel />
                </div>
            </div>
        </div>
    );
}
