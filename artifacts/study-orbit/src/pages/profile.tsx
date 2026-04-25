import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateUser, useUpdateUser, useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUserId, setCurrentUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  subject: z.string().min(1, "Please select a subject."),
  studyTime: z.string().min(1, "Please select a study time preference."),
  skillLevel: z.string().min(1, "Please select a skill level."),
  goalType: z.string().min(1, "Please select a goal type."),
  skillCategories: z.string().min(1, "Comma separated skills please."),
  bio: z.string().max(120, "Bio must be max 120 characters.").optional().nullable(),
});

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();

  const { data: user } = useGetUser(currentUserId || 0, {
    query: { enabled: !!currentUserId }
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      subject: "",
      studyTime: "",
      skillLevel: "",
      goalType: "",
      skillCategories: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        subject: user.subject,
        studyTime: user.studyTime,
        skillLevel: user.skillLevel,
        goalType: user.goalType,
        skillCategories: user.skillCategories?.join(", ") || "",
        bio: user.bio,
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    const formattedData = {
      ...values,
      skillCategories: values.skillCategories.split(",").map(s => s.trim()).filter(Boolean),
    };

    if (currentUserId && user) {
      updateUser.mutate(
        { id: currentUserId, data: formattedData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(currentUserId) });
            toast({ title: "Profile Updated", description: "Your orbital parameters have been recalibrated." });
            setLocation("/");
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Error", description: "Transmission failed." });
          }
        }
      );
    } else {
      createUser.mutate(
        { data: formattedData as any },
        {
          onSuccess: (newUser) => {
            setCurrentUserId(newUser.id);
            toast({ title: "Profile Created", description: "Welcome to StudyOrbit. Preparing for launch." });
            setLocation("/");
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to establish uplink." });
          }
        }
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className="glass-panel border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-mono text-primary">Pilot Registration</CardTitle>
          <CardDescription className="text-muted-foreground font-mono">
            Enter your orbital parameters to find matching satellites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Callsign (Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Commander Shepard" className="bg-background/50 border-primary/20 font-mono text-white focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Primary Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Frontend">Frontend</SelectItem>
                          <SelectItem value="Backend">Backend</SelectItem>
                          <SelectItem value="AI/ML">AI/ML</SelectItem>
                          <SelectItem value="DSA">DSA</SelectItem>
                          <SelectItem value="Accounting">Accounting</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studyTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Active Cycle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select active time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                          <SelectItem value="Flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Skill Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select rank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Mission Objective</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Exam">Exam</SelectItem>
                          <SelectItem value="Project">Project</SelectItem>
                          <SelectItem value="Hackathon">Hackathon</SelectItem>
                          <SelectItem value="Practice">Practice</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skillCategories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Skill Categories (Comma Separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="React, Node.js, Python" className="bg-background/50 border-primary/20 font-mono text-white focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Transmission Log (Bio)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ready to build something awesome..." 
                        className="bg-background/50 border-primary/20 font-mono text-white resize-none focus-visible:ring-primary" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-primary/20 hover:bg-primary/40 border border-primary text-primary font-mono uppercase tracking-widest" disabled={createUser.isPending || updateUser.isPending}>
                {createUser.isPending || updateUser.isPending ? "Transmitting..." : currentUserId ? "Update Parameters" : "Initialize Uplink"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
