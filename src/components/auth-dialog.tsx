
"use client";

import { useState } from "react";
import { useForm, FormProvider, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findUserByEmailOrPhone, createUser } from "@/services/user-service";
import { useAuth } from "@/hooks/use-auth";
import type { User, NewUser } from "@/lib/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type AuthStep = "identifier" | "otp" | "details" | "password";

const identifierSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required."),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits."),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const detailsSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  age: z.coerce.number().min(18, "You must be at least 18.").max(100),
  gender: z.enum(["male", "female", "other"]),
  city: z.string().min(2, "City is required."),
  country: z.string().min(2, "Country is required."),
});

const HARDCODED_OTP = "123456";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

export function AuthDialog({ open, onOpenChange, onLoginSuccess }: AuthDialogProps) {
  const [step, setStep] = useState<AuthStep>("identifier");
  const [isLoading, setIsLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { login } = useAuth();
  
  const combinedSchema = identifierSchema.merge(otpSchema).merge(detailsSchema).merge(passwordSchema);
  
  const currentSchema = 
    step === "identifier" ? identifierSchema :
    step === "details" ? detailsSchema :
    step === "password" ? passwordSchema :
    otpSchema;

  const methods = useForm<z.infer<typeof combinedSchema>>({
    resolver: zodResolver(currentSchema),
    mode: "onChange",
    defaultValues: {
        identifier: "",
        otp: "",
        password: "",
        fullName: "",
        age: 0,
        city: "",
        country: "",
    }
  });

  const handleIdentifierSubmit: SubmitHandler<z.infer<typeof identifierSchema>> = async (data) => {
    setIsLoading(true);
    try {
      const user = await findUserByEmailOrPhone(data.identifier);
      setExistingUser(user);
      if (user) {
        // If user is a coach, ask for password. Otherwise, OTP.
        if (user.role === 'coach') {
            setStep("password");
        } else {
            setStep("otp");
        }
      } else {
        setStep("details");
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not verify identifier.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handlePasswordSubmit: SubmitHandler<z.infer<typeof passwordSchema>> = async (data) => {
    setIsLoading(true);
    const loggedIn = await login(existingUser!.email!, data.password, existingUser!.role);
    if(loggedIn) {
        toast({ title: "Login Successful!", description: `Welcome back, ${existingUser!.fullName}!`});
        onLoginSuccess();
    } else {
        toast({ title: "Login Failed", description: "The password you entered is incorrect.", variant: "destructive" });
    }
    setIsLoading(false);
  }

  const handleDetailsSubmit: SubmitHandler<z.infer<typeof detailsSchema>> = async (data) => {
    setIsLoading(true);
    const identifier = methods.getValues("identifier");
    const isEmail = identifier.includes('@');

    const newUser: Omit<NewUser, 'id' | 'createdAt' | 'passwordHash'> = {
        ...data,
        email: isEmail ? identifier : null,
        phone: isEmail ? null : identifier,
        fullName: data.fullName,
        role: 'customer' // This flow is only for customers
    }

    try {
        const createdUser = await createUser(newUser);
        setExistingUser(createdUser);
        setStep("otp");
        toast({ title: "Profile Created!", description: "Please verify with the OTP to login."});
    } catch(error) {
         toast({ title: "Error", description: "Could not create your profile.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleOtpSubmit: SubmitHandler<z.infer<typeof otpSchema>> = async (data) => {
    setIsLoading(true);
    if (data.otp !== HARDCODED_OTP) {
        toast({ title: "Invalid OTP", description: "The OTP you entered is incorrect.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    if (existingUser) {
        const loggedIn = await login(existingUser.email || existingUser.phone!, 'otp_login', existingUser.role);
        if (loggedIn) {
            toast({ title: "Login Successful!", description: `Welcome, ${existingUser.fullName}!`});
            onLoginSuccess();
        } else {
            toast({ title: "Error", description: "Something went wrong during login.", variant: "destructive" });
        }
    } else {
        toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const resetFlow = () => {
    setStep("identifier");
    setExistingUser(null);
    methods.reset();
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        resetFlow();
    }
    onOpenChange(isOpen);
  }

  const getTitle = () => {
    switch (step) {
        case "identifier": return "Login or Sign Up";
        case "details": return "Complete Your Profile";
        case "otp": return "Enter OTP";
        case "password": return "Enter Password";
    }
  }
   const getDescription = () => {
    switch (step) {
        case "identifier": return "Enter your email or phone number to continue.";
        case "details": return "We need a few more details to create your account.";
        case "otp": return `An OTP has been sent to ${methods.getValues("identifier")}.`;
        case "password": return `Welcome back, ${existingUser?.fullName}! Please enter your password.`;
    }
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <Form {...methods}>
            {step === 'identifier' && (
                <form onSubmit={methods.handleSubmit(handleIdentifierSubmit)} className="space-y-4">
                    <FormField control={methods.control} name="identifier" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email or Phone</FormLabel>
                            <FormControl><Input placeholder="e.g., user@example.com or 9876543210" {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
                    </Button>
                </form>
            )}

            {step === 'details' && (
                 <form onSubmit={methods.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                    <FormField control={methods.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Max Robinson" {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={methods.control} name="age" render={({ field }) => (
                            <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="e.g., 25" {...field} /></FormControl><FormMessage/></FormItem>
                        )}/>
                        <FormField control={methods.control} name="gender" render={({ field }) => (
                            <FormItem><FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage/></FormItem>
                        )}/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={methods.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Mumbai" {...field} /></FormControl><FormMessage/></FormItem>
                        )}/>
                        <FormField control={methods.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., India" {...field} /></FormControl><FormMessage/></FormItem>
                        )}/>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
                    </Button>
                 </form>
            )}
            
            {step === 'password' && (
                 <form onSubmit={methods.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                     <FormField control={methods.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
                    </Button>
                 </form>
            )}

            {step === 'otp' && (
                 <form onSubmit={methods.handleSubmit(handleOtpSubmit)} className="space-y-4">
                     <FormField control={methods.control} name="otp" render={({ field }) => (
                        <FormItem><FormLabel>One-Time Password</FormLabel><FormControl><Input placeholder="123456" {...field} /></FormControl><FormMessage/></FormItem>
                    )}/>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Verify and Login"}
                    </Button>
                 </form>
            )}
          </Form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
