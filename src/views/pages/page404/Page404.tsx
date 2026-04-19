import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React from "react";

const Page404 = () => {
	return (
		<div className="bg-muted min-h-screen flex flex-row items-center">
			<div className="container mx-auto">
				<div className="flex justify-center">
					<div className="max-w-md w-full mx-4">
						<div className="clearfix">
							<h1 className="float-left text-6xl font-bold mr-4">404</h1>
							<h4 className="pt-3 text-lg font-semibold">
								Oops! You&apos;re lost.
							</h4>
							<p className="text-muted-foreground">
								The page you are looking for was not found.
							</p>
						</div>
						<div className="flex gap-2 mt-4">
							<div className="relative flex-1">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									type="text"
									placeholder="What are you looking for?"
									className="pl-8"
								/>
							</div>
							<Button variant="secondary">Search</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Page404;
