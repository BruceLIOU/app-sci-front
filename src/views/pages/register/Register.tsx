import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React from "react";

const Register = () => {
	return (
		<div className="bg-muted min-h-screen flex flex-row items-center">
			<div className="container mx-auto">
				<div className="flex justify-center">
					<div className="w-full max-w-md mx-4">
						<Card>
							<CardContent className="p-4">
								<form>
									<h1 className="text-2xl font-bold mb-1">Register</h1>
									<p className="text-muted-foreground mb-4">
										Create your account
									</p>
									<div className="mb-3">
										<Input placeholder="Username" autoComplete="username" />
									</div>
									<div className="mb-3">
										<Input placeholder="Email" autoComplete="email" />
									</div>
									<div className="mb-3">
										<Input
											type="password"
											placeholder="Password"
											autoComplete="new-password"
										/>
									</div>
									<div className="mb-4">
										<Input
											type="password"
											placeholder="Repeat password"
											autoComplete="new-password"
										/>
									</div>
									<Button className="w-full">Create Account</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Register;
