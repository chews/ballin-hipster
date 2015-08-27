//
//  HomeViewController.m
//  WrdGme
//
//  Copyright (c) 2015 Genevieve L'Esperance. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "HomeViewController.h"
#import "GameViewController.h"
#import <Parse/Parse.h>


@interface HomeViewController ()
@property (weak, nonatomic) IBOutlet UILabel *loginComments;
@property (strong, nonatomic) NSArray *currTriads;
@property (strong, nonatomic) NSString *currWord;

@end

@implementation HomeViewController
@synthesize loginField;


- (void)viewDidAppear:(BOOL)animated {
    [self.loginComments setText:@""];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [self userInitiation:textField.text];
    return YES;
}

- (void)retrieveTriadsForWord
{
    PFUser *currUser = [PFUser currentUser];

    if (currUser) {
        PFQuery *query = [PFQuery queryWithClassName:@"WrdEntry"];
        
        NSArray *wordIds = [currUser objectForKey:@"gameWords"];
        
        uint32_t rnd = arc4random_uniform((int)[wordIds count]);
        NSString *currId = [wordIds objectAtIndex:rnd];
        
        [query whereKey:@"objectId" equalTo:currId];
        [query findObjectsInBackgroundWithBlock:^(NSArray *word, NSError *error)
        {
            GameViewController *gvc = [[GameViewController alloc] init];
            UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"Main" bundle:nil];
            gvc = (GameViewController *)[storyboard instantiateViewControllerWithIdentifier:@"GameViewControllerStoryboardID"];
            gvc.currTriads = (NSArray *) [[word firstObject] objectForKey:@"combos"];
            gvc.currWord = (NSString *) [[word firstObject] objectForKey:@"word"];
            NSLog(@"currWord: %@", self.currWord);

            [[self navigationController] pushViewController:gvc animated:YES];
        }];
    }
}

- (void)gameLogin
{
    [PFCloud callFunctionInBackground:@"userLogin"
                       withParameters:@{}
                                block:^(PFObject *object, NSError *error){
                                    if (error != nil)
                                    {
                                        [self.loginComments setText:@"Is your account private?"];
                                    }
                                    else
                                    {
                                        [self retrieveTriadsForWord];
                                    }
                                    }];
}

- (void)userLogin:(NSString *)username
{
    [PFUser logInWithUsernameInBackground:username
                                 password:@"gen"
                                    block:^(PFUser *user, NSError *error) {
                                        [self gameLogin];
                                        
                                    }];
}

- (void)userInitiation:(NSString*)username
{
//    [PFCloud callFunctionInBackground:@"scoreWords"
//                       withParameters:@{}];
    
    [PFCloud callFunctionInBackground:@"userInitiation"
                       withParameters:@{@"username":username}
                                block:^(PFObject *object, NSError *error) {
                                    if (error != nil)
                                    {
                                        NSString *newLine = @"\n";

                                        self.loginComments.text = [@"1. Do you have Internet?\n2. Is your account private?\n3. Check your spelling." stringByReplacingOccurrencesOfString:@"\\n" withString:newLine];
                                    }
                                    else
                                    {
                                        [self userLogin:username];
                                    }
                                    }];

}


-(void)updateComment:(NSString *)comment
{
    [self.loginComments setText:comment];
}



@end